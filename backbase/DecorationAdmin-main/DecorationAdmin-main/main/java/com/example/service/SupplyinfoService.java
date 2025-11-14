package com.example.service;

import com.example.entity.Supplyinfo;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.mapper.SupplyinfoMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service
public class SupplyinfoService extends ServiceImpl<SupplyinfoMapper, Supplyinfo> {

    @Resource
    private SupplyinfoMapper supplyinfoMapper;

}
