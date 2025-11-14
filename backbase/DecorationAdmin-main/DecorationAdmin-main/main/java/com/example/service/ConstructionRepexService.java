package com.example.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.entity.ConstructionRep;
import com.example.entity.ConstructionRepex;
import com.example.entity.Constructioninfo;
import com.example.entity.Constructionrec;
import com.example.mapper.*;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

@Service
public class ConstructionRepexService extends ServiceImpl<ConstructionRepexMapper, ConstructionRepex> {

    @Resource
    private ConstructioninfoService constructioninfoService;
    @Resource
    private ConstructioncertService constructioncertService;
    @Resource
    private ConstructioncertMapper constructioncertMapper;
    @Resource
    private ConstructioninfoMapper constructioninfoMapper;
    @Resource
    private ConstructionrecService constructionrecService;
    @Resource
    private ConstructionrecMapper constructionrecMapper;
    @Resource
    private ConstructionRepService constructionRepService;

    public ConstructionRepex generateall(long id)
    {
        //得到具体细则
        ConstructionRepex one=new ConstructionRepex();
        one.setConstructionRepList(constructionRepService.generate(id));
        //得到总花费
        List<Constructionrec> constructionrecList = new ArrayList<>();
        QueryWrapper<Constructionrec> wrapper1 = new QueryWrapper<>();
        wrapper1.eq("projectid",id);
        constructionrecList=constructionrecMapper.selectList(wrapper1);
        Integer moneyinall=0;
        for (Constructionrec constructionrec : constructionrecList)
        {
            moneyinall+=constructionrec.getMoney();
        }
        one.setMoneyinall(moneyinall);
        //得到各个凭证花费
        List<Integer> certmoneys=new ArrayList<>();
        for(int i=1;i<=13;i++)
        {
            Integer certmoney=0;
            QueryWrapper<Constructioninfo> wrapper2 = new QueryWrapper<>();
            wrapper2.eq("certid", i);
            List<Constructioninfo> constructioninfoList = new ArrayList<>();
            constructioninfoList = constructioninfoMapper.selectList(wrapper2);
            for (Constructioninfo constructioninfo : constructioninfoList) {
                QueryWrapper<Constructionrec> wrapper3 = new QueryWrapper<>();
                wrapper3.eq("constructionid", constructioninfo.getId());
                List<Constructionrec> constructionrecList1 = constructionrecMapper.selectList(wrapper3);
                for (Constructionrec constructionrec : constructionrecList1)
                {
                    certmoney+=constructionrec.getMoney();
                }
            }
            certmoneys.add(certmoney);

        }
        one.setCertmoney(certmoneys);

        return one;

    }

}
