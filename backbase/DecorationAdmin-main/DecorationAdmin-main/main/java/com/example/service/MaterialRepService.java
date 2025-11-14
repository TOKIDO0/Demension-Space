package com.example.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.entity.Constructionrec;
import com.example.entity.MaterialRep;
import com.example.entity.Materialpurchase;
import com.example.entity.Supplyinfo;
import com.example.exception.CustomException;
import com.example.mapper.MaterialRepMapper;
import com.example.mapper.MaterialRepexMapper;
import com.example.mapper.MaterialpurchaseMapper;
import com.example.mapper.SupplyinfoMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;


@Service
public class MaterialRepService extends ServiceImpl<MaterialRepMapper,MaterialRep> {

    @Resource
    private MaterialpurchaseService materialpurchaseService;
    @Resource
    private SupplyinfoService supplyinfoService;
    @Resource
    private MaterialpurchaseMapper materialpurchaseMapper;
    @Resource
    private SupplyinfoMapper supplyinfoMapper;

    public List<MaterialRep> generate(long id)
    {
        List<MaterialRep> materialRepList=new ArrayList<>();
        List<Materialpurchase> materialpurchaseList=new ArrayList<>();
        QueryWrapper<Materialpurchase> wrapper1 = new QueryWrapper<>();
        wrapper1.eq("projectid",id);
        materialpurchaseList=materialpurchaseMapper.selectList(wrapper1);
        if(materialpurchaseList.size()==0)
        {
            throw new CustomException("-1", "无此项目");
        }
        QueryWrapper<Supplyinfo> wrapper2=new QueryWrapper<>();

        for(Materialpurchase materialpurchase:materialpurchaseList)
        {
            MaterialRep materialRep=new MaterialRep();
            //wrapper2.eq("id",materialpurchase.getSupplierid());
            Supplyinfo supplyinfo=supplyinfoService.getById(materialpurchase.getSupplierid());
            materialRep.setProjectid(id);
            materialRep.setMaterialid(materialpurchase.getId());
            materialRep.setMaterialname(materialpurchase.getName());
            materialRep.setMoney(materialpurchase.getMoney());
            materialRep.setSupplyname(supplyinfo.getName());
            materialRepList.add(materialRep);
        }


        return materialRepList;
    }

}
